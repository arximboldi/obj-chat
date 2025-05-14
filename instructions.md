Create a simple web app that allows you to chat with the machine,
backed by an LLM.

The chat is presented to the user in a way that looks and feels like a
80s terminal, with green text over a black background. The user inputs
its messages into the terminal. The responses from the LLM are
streamed back to the user as it comes. (A bit like the chat in the
film The Matrix, where Neo is told to follow the white rabbit).

The machine in the chat identifies as a person called Obj, speaks
spanish, and has a childish personallity.

To implement this web app, we nede two components, a client (the
front-end), and a server. The code for each should be in a `client`
and `server` folder respectively.

The server exposes a simple API that allows the client to submit chat
messages and stream the response back.  It implements this by making a
request into a OpenAI LLM, properly adapting the prompt to give the
chat bot its unique personality. The client uses the server API to
implement the chat functionality.

You can chose whatever language and frame-works you prefer. Code
simplicity and a low number of depencies and easy set-up are
preferred.

Add a shell.nix file to run a developer enviroment and a default.nix
to build the application.  Please pin nixpkgs to a recent working
version.
