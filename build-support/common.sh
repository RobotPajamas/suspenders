COLOR_BLUE="\x1b[34m"
COLOR_RED="\x1b[31m"
COLOR_GREEN="\x1b[32m"
COLOR_RESET="\x1b[0m"

function log() {
  echo -e "$@" 1>&2
}

function die() {
  (($# > 0)) && log "\n${COLOR_RED}$*${COLOR_RESET}"
  exit 1
}

function green() {
  (($# > 0)) && log "\n${COLOR_GREEN}$*${COLOR_RESET}"
}

function git_merge_base() {
    # This prints the tracking branch if set and otherwise falls back to the commit before HEAD.
    # We fall back to the commit before HEAD to attempt to account for situations without a tracking
    # branch, which might include `main` builds, but can also include branch-PR builds, where
    # Travis checks out a specially crafted Github `+refs/pull/11516/merge` branch.
    git rev-parse --symbolic-full-name --abbrev-ref HEAD@\{upstream\} 2> /dev/null || git rev-parse HEAD^
}
