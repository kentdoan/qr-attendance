#!/bin/bash

DIR="$(dirname "$0")"

bash "$DIR/create_admin.sh"
bash "$DIR/create_teacher.sh"
bash "$DIR/create_student.sh"
