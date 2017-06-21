git ls-tree -r --name-only HEAD | while read filename; do     
    recent_time=$(git log -1 --format="%ai" -- "$filename")
    most_recent_commit="$(git log -1 --format="%H" -- "$filename")"
    if [ "$most_recent_commit" == "8033440ecdf88cf05bb43393616856452ee21bf2" ]; then
        recent_time=$(git log -1 --format="%ai" c3099205091d9a523a88434e07158adce482cde7~1 -- "$filename")
    fi
    echo "$recent_time  $filename"; 
done | sort
