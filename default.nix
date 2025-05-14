{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/23.05.tar.gz") {} }:
pkgs.stdenv.mkDerivation {
  name = "chat-app";
  buildInputs = [
    pkgs.python3
    pkgs.python3Packages.fastapi
    pkgs.python3Packages.uvicorn
    pkgs.python3Packages.openai
  ];
  src = ./.;
  buildPhase = ''
    echo "Building application..."
  '';
  installPhase = ''
    mkdir -p $out
    cp -r * $out
  '';
}
