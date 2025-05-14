# Chat with Obj

This project is a simple chat application where users can interact with "Obj," a virtual assistant with a playful, childlike personality that speaks Spanish. The application uses OpenAI's GPT-3.5-turbo model to generate responses.

## Features

- Real-time chat with a WebSocket-based backend.
- Terminal-like user interface for a retro experience.
- OpenAI GPT-3.5-turbo integration for intelligent responses.

## Project Structure

- `client/index.html`: The frontend of the application, providing a terminal-like chat interface.
- `server/main.py`: The backend server, built with FastAPI, handling WebSocket connections and OpenAI API calls.
- `default.nix` and `shell.nix`: Nix configuration files for setting up the development environment.
- `.gitignore`: Specifies files and directories to be ignored by Git.

## Prerequisites

- Python 3.8 or higher
- Nix (if using the provided Nix environment)
- An OpenAI API key

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   If using Nix:
   ```bash
   nix-shell
   ```
   Otherwise, install Python dependencies manually:
   ```bash
   pip install fastapi uvicorn openai
   ```

3. Set up environment variables:
   ```bash
   export OPENAI_API_KEY=<your-api-key>
   export OPENAI_BASE_URL=https://api.openai.com/v1
   ```

4. Start the server:
   ```bash
   uvicorn server.main:app --reload
   ```

5. Open the frontend:
   Open `client/index.html` in your browser.

## Usage

- Type your messages directly into the terminal-like interface.
- Press "Enter" to send your message.
- Obj will respond in real-time.

## Development

- To modify the frontend, edit `client/index.html`.
- To modify the backend, edit `server/main.py`.

## License

This project is licensed under the MIT License. See `LICENSE` for details.

## Acknowledgments

- [OpenAI](https://openai.com) for the GPT-3.5-turbo model.
- [FastAPI](https://fastapi.tiangolo.com) for the backend framework.
