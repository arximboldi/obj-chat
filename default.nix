{ pkgs ? import ./nix/nixpkgs.nix {} }:

with pkgs;
with import (pkgs.fetchFromGitHub {
  owner = "hercules-ci";
  repo = "gitignore.nix";
  rev = "80463148cd97eebacf80ba68cf0043598f0d7438";
  sha256 = "1l34rmh4lf4w8a1r8vsvkmg32l1chl0p593fl12r28xx83vn150v";
}) { inherit lib; };


let
src = gitignoreSource ./.;

in pkgs.writeShellApplication rec {
  name = "obj-chat";
  runtimeInputs = [
    (python3.withPackages (ps: with ps; [
      uvicorn
      fastapi
      openai
      flake8
      setuptools
    ]))
  ];
  derivationArgs = { buildInputs = runtimeInputs; };
  text = ''
    uvicorn --app-dir ${src} server.main:app "$@"
  '';
}
