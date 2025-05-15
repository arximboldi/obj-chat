from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from openai import AsyncOpenAI

import os
import logging

def read_system_prompt():
    """
    Read the system prompt from a file in the same directory as this script,
    removing lines that start with ';'.
    """
    system_prompt_path = os.path.join(os.path.dirname(__file__), "prompt.md")
    with open(system_prompt_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    filtered_lines = [line for line in lines if not line.lstrip().startswith(";")]
    return "".join(filtered_lines)

SYSTEM_PROMPT = read_system_prompt()

app = FastAPI()

client = AsyncOpenAI(
    # This is the default and can be omitted
    base_url=os.environ.get("OPENAI_BASE_URL"),
    api_key=os.environ.get("OPENAI_API_KEY"),
)

app.mount("/static", StaticFiles(directory="client/static"), name="static")

@app.get("/")
async def get():
    return HTMLResponse(open("client/index.html").read())

@app.websocket("/chat")
async def chat(websocket: WebSocket):
    await websocket.accept()
    # await websocket.send_text("Hola, soy Obj. ¿En qué puedo ayudarte hoy?\n")

    # Initialize the chat history
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

    while True:
        try:
            # Receive user message and add it to the history
            user_message = await websocket.receive_text()
            messages.append({"role": "user", "content": user_message})

            # Get the assistant's response
            response = await client.chat.completions.create(
                model="gpt-4.1",
                messages=messages,
                stream=True
            )

            # Collect and send the assistant's response
            assistant_message = ""
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    assistant_message += chunk.choices[0].delta.content
                    await websocket.send_text(chunk.choices[0].delta.content)
            await websocket.send_text("\n")

            # Add the assistant's response to the history
            messages.append({"role": "assistant", "content": assistant_message})
        except Exception as e:
            logging.error(f"An error occurred: {e}")
            await websocket.close()
            break
