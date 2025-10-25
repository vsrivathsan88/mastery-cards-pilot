{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.pnpm
    pkgs.nodePackages.typescript-language-server
    pkgs.nodePackages.vscode-langservers-extracted
  ];
}
