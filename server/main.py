from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import openai
import os

app = FastAPI()

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

app.mount("/static", StaticFiles(directory="client"), name="static")

@app.get("/")
async def get():
    return HTMLResponse(open("client/index.html").read())

@app.websocket("/chat")
async def chat(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Hola, soy Obj. ¿En qué puedo ayudarte hoy?")
    while True:
        try:
            user_message = await websocket.receive_text()
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Eres Obj, un niño que habla español y tiene una personalidad infantil."},
                    {"role": "user", "content": user_message}
                ],
                stream=True
            )
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.get("content"):
                    await websocket.send_text(chunk.choices[0].delta["content"])
        except Exception as e:
            import logging
            logging.error(f"An error occurred: {e}")
            await websocket.close()
            break
