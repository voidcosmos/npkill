#!/bin/bash
#
# This script create a example node_modules files
# only for demo purpose.
#

BASE_PATH="$HOME/allStartHere"

function create(){
  projectName=$1
  fileSize=$2
  fakeModificationDate=$(expr $(date +"%s") - $(shuf -i 0-5259486 -n 1)) # 2 month of margin
  mkdir -p "$BASE_PATH/$projectName/node_modules"
  head -c ${fileSize}MB /dev/zero > "$BASE_PATH/$projectName/node_modules/a"
  touch -a -m -d @$fakeModificationDate "$BASE_PATH/$projectName/sample_npkill_file"
}


create 'secret-project' '58'
create 'Angular Tuto' '812'
create 'testest' '43'
create 'archived/Half Dead 3' '632'
create 'cats' '384'
create 'navigations/001' '89'
create 'navigations/002' '88'
create 'navigations/003' '23'
create 'more-cats' '371'
create 'projects/hero-sample' '847'
create 'projects/awesome-project' '131'
create 'projects/calculator/frontend' '883'
create 'projects/caluclator/backend' '244'
create 'games/buscaminas' '349'
create 'games/archived/cards' '185'
create 'archived/weather-api' '151'
create 'kiwis-are-awesome' '89'
create 'projects/projects-of-projects/trucs' '237'
create 'projects/projects-of-projects/conversor-divisas' '44'
create 'projects/vue/hello-world' '160'
create 'projects/vue/Quantic stuff' '44'
