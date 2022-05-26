#!/bin/bash

# Get path of this script, so we can use scripts in its
# directory, even when running from another directory
SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

# Import variables
source $SCRIPTPATH/vars.sh

# Clean output directory
printf "Cleaning previous artifacts...\n"
rm -rf $OutPath

deno fmt

for target in ${Targets[@]}; do
  OutFile="$OutPath/${OutName}_$target"
  printf "\nBuilding for $target\n"
  deno compile $DenoArgs --target=$target --output=$OutFile $Entrypoint
done