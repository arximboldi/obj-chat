{ pkgs ? import ./nix/nixpkgs.nix {} }:

let
  obj-chat = import ./default.nix { inherit pkgs; };

in
pkgs.mkShell {
  inputsFrom = [
    obj-chat
  ];
  shellHook = ''
    export REPO_ROOT=`dirname ${toString ./shell.nix}`
    export STATE_DIR="$REPO_ROOT/state"
  '';
}
