#!/bin/sh
ps ax | grep copilotbrowser | grep "vite\|tsc\|esbuild" | sed 's|pts/.*||' | xargs kill
