from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.websockets import WebSocketDisconnect
from openai import AsyncOpenAI

import os
import logging
import json
import datetime
import asyncio
import aiofiles
import aiofiles.os
import random

VERSION="1.1"

def get_current_date_spanish():
    """
    Returns the current date in Spanish, e.g. "16 de Mayo de 2025"
    """
    meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    hoy = datetime.date.today()
    return f"{hoy.day} de {meses[hoy.month - 1]} de {hoy.year}"

def read_system_prompt():
    """
    Read the system prompt from a file in the same directory as this script,
    removing lines that start with ';'.
    """
    current_date = get_current_date_spanish()
    system_prompt_path = os.path.join(os.path.dirname(__file__), "prompt.md")
    with open(system_prompt_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    filtered_lines = [
        line for line in lines if not line.lstrip().startswith(";")
    ]
    return "".join(filtered_lines)

CLIENT_DIR = os.path.join(os.path.dirname(__file__), "..", "client")
STATE_DIR = os.getenv("STATE_DIR")

if STATE_DIR is None:
    raise RuntimeError("need to set the STATE_DIR environment variable!")

CHATS_DIR = os.path.join(STATE_DIR, "chats")

SYSTEM_PROMPT = read_system_prompt()

LOADING_MESSAGE=f''' '''
WELCOME_MESSAGE=f'''\
Cargando ..............
Bienvenidx a Obj-OS {VERSION}
<3
'''

READY_TOKEN="%{OBJOS-READY}%"
CLEAR_TOKEN="%{OBJOS-CLEAR}%"

app = FastAPI()
client = AsyncOpenAI()

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(CLIENT_DIR, "static")),
    name="static"
)

@app.get("/")
async def get():
    return HTMLResponse(open(os.path.join(CLIENT_DIR, "index.html")).read())

class ChatLogFile:
    """
    Handles writing chat messages to a log file in JSON array format.
    Can be used as a context manager.
    """

    def __init__(self, websocket, chats_dir):
        requester_ip = (
            websocket.client.host
            if hasattr(websocket, "client") and websocket.client
            else "unknown"
        )
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
        log_filename = (
            f"chat_v{VERSION}_{timestamp}_{requester_ip.replace(':', '_')}.json"
        )
        log_path = os.path.join(chats_dir, log_filename)
        self._log_path = log_path
        self._is_init = False
        self._finished = False

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.finish()

    async def add(self, message_obj):
        """
        Write a message object to the log file in JSON format.
        Adds a timestamp to the message.
        """
        if not self._is_init:
            await aiofiles.os.makedirs(os.path.dirname(self._log_path), exist_ok=True)
            self._log_file = await aiofiles.open(self._log_path, "w", encoding="utf-8")
            await self._log_file.write("[\n")
        else:
            await self._log_file.write(",\n")
        msg_with_time = dict(message_obj)
        msg_with_time["timestamp"] = datetime.datetime.now().isoformat()
        await self._log_file.write(
            json.dumps(msg_with_time, ensure_ascii=False, indent=2)
        )
        await self._log_file.flush()
        self._is_first = False

    async def finish(self):
        """
        Write the closing bracket to end the JSON array and close the log file.
        """
        if self._is_init and not self._finished:
            await self._log_file.write("\n]\n")
            await self._log_file.close()
            self._finished = True

async def send_text_slow(websocket, text, speed=1.0):
    for char in text:
        await asyncio.sleep(random.uniform(
            0.01 / speed, 0.1 / speed
        ))
        await websocket.send_text(char)


@app.websocket("/chat")
async def chat(websocket: WebSocket):
    await websocket.accept()

    # Use ChatLogFile as a context manager
    async with ChatLogFile(websocket, CHATS_DIR) as chat_log:
        try:
            # Send the welcome message
            await send_text_slow(websocket, LOADING_MESSAGE)
            await websocket.send_text(CLEAR_TOKEN)
            await send_text_slow(websocket, WELCOME_MESSAGE)
            await websocket.send_text(READY_TOKEN)

            # Initialize the chat history
            system_msg_obj = {
                "role": "system",
                "content": "".join([
                    SYSTEM_PROMPT,
                    get_current_date_spanish()
                ])
            }
            messages = [system_msg_obj]
            # Write the system prompt as the first message in the log
            await chat_log.add(system_msg_obj)

            while True:
                # Receive user message and add it to the history
                user_message = await websocket.receive_text()
                user_msg_obj = {
                    "role": "user",
                    "content": user_message
                }
                messages.append(user_msg_obj)

                # Write user message to log
                await chat_log.add(user_msg_obj)

                # Get the assistant's response
                response = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    # temperature=0.8,
                    stream=True
                )

                # Collect and send the assistant's response
                assistant_message = ""
                async for chunk in response:
                    if (
                        chunk.choices
                        and chunk.choices[0].delta.content
                    ):
                        assistant_message += chunk.choices[0].delta.content
                        await websocket.send_text(
                            chunk.choices[0].delta.content
                        )
                await websocket.send_text(READY_TOKEN)

                # Add the assistant's response to the history
                assistant_msg_obj = {
                    "role": "assistant",
                    "content": assistant_message
                }
                messages.append(assistant_msg_obj)

                # Write assistant message to log
                await chat_log.add(assistant_msg_obj)
        except WebSocketDisconnect:
            # Client closed the connection, do not log as error
            pass
