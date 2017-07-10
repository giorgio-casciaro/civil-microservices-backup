#!/bin/bash

echo "Finding and Purging Big Files From Git History"
echo "=============================================="
echo ""
echo "http://naleid.com/blog/2012/01/17/finding-and-purging-big-files-from-git-history/"
echo ""

pushd "$(git rev-parse --show-toplevel)" > /dev/null

echo "What object SHA is associated with each file in the Repo?"
if [ ! -e _allfileshas.txt ]; then
    git rev-list --objects --all |sort -k 2 |egrep ' [a-zA-Z]+' > _allfileshas.txt
fi

echo "What Unique Files Exist Throughout The History of My Git Repo?"
if [ ! -e _uniquefiles.txt ]; then
    cat _allfileshas.txt |cut -f 2 -d\  |uniq > _uniquefiles.txt
fi

echo "How Big Are The Files In My Repo?"
if [ ! -e _bigobjects.txt ]; then
    git gc && git verify-pack -v .git/objects/pack/pack-*.idx |egrep "^\w+ blob\W+[0-9]+ [0-9]+ [0-9]+$" |sort -k 3 -n -r > _bigobjects.txt
fi

echo "Take that result and iterate through each line of it to find the SHA, file size in bytes, and real file name"
if [ ! -e _bigtosmall.txt ]; then
    sort _allfileshas.txt > _allfileshas.shasort
    sort _bigobjects.txt > _bigobjects.shasort
    join _bigobjects.shasort _allfileshas.shasort |awk '{print $1,$3,$6}' |sort -r -n -k 2 > _bigtosmall.txt
    rm _allfileshas.shasort
    rm _bigobjects.shasort
fi

echo "Done."
echo ""
echo "For example:"
echo "To shrink your repo by removing all files matching '*.sql' and '*.sql.gz', run the following commands:"
echo ""

repo_path=`pwd`
repo_name=`pwd |sed -e 's/.*\///'`

echo "git filter-branch --prune-empty --index-filter 'git rm -rf --cached --ignore-unmatch *.sql.gz *.sql' --tag-name-filter cat -- --all"
echo "cd .."
echo "git clone --no-hardlinks file://${repo_path} ${repo_name}.shrink"
echo "cd "

popd > /dev/null

