#!/usr/bin/env bash

# Copied from obsidian-dataview
# Builds plugin and allows you to provide a path to the vault that it should be installed in.
# Useful for when you want to dry-run the plugin in a vault other than the test vault.

VAULT="$1"
TARGET="$VAULT/.obsidian/plugins/obsidian-chat/"
mkdir -p "$TARGET"
cp -f main.js "$TARGET"
cp -f styles.css "$TARGET"
cp -f manifest.json "$TARGET/manifest.json"
echo Installed plugin files to "$TARGET"
