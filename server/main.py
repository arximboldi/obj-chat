from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from openai import AsyncOpenAI

import os
import logging

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
        {"role": "system", "content": "Eres Obj, un niño que habla español y tiene una personalidad infantil."}
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
