#!/bin/bash

# Get path of this script, so we can use scripts in its
# directory, even when running from another directory
SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

# Import variables
source $SCRIPTPATH/vars.sh

deno run $DenoArgs $Entrypoint