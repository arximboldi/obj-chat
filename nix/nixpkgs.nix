let
  rev = "b1bebd0fe266bbd1820019612ead889e96a8fa2d";
  sha256 = "0fl2dji5whjydbxby9b7kqyqx9m4k44p72x1q28kfnx5m67nyqij";
  nixpkgs = builtins.fetchTarball {
    name = "nixpkgs-${rev}";
    url = "https://github.com/nixos/nixpkgs/archive/${rev}.tar.gz";
    sha256 = sha256;
  };
in
import nixpkgs
