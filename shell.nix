{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/24.11.tar.gz") {} }:
pkgs.mkShell {
  shellHook = ''
    export REPO_ROOT=`dirname ${toString ./shell.nix}`
    export STATE_DIR="$REPO_ROOT/state"
  '';
  buildInputs = [
    pkgs.python3
    pkgs.python3Packages.fastapi
    pkgs.python3Packages.uvicorn
    pkgs.python3Packages.openai
    pkgs.python3Packages.flake8
    pkgs.python3Packages.setuptools
  ];
}
