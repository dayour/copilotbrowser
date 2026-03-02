# Mapping distribution libraries to package names

copilotbrowser requires a set of packages on Linux distribution for browsers to work.
Before launching browser on Linux, copilotbrowser uses `ldd` to make sure browsers have all
dependencies met.

If this is not the case, copilotbrowser suggests users packages to install to
meet the dependencies. This tool helps to maintain a map between package names
and shared libraries it provides, per distribution.

## Usage

To generate a map of browser library to package name on Ubuntu:bionic:

```bash
./run.sh ubuntu:bionic
```

Results will be saved to the `RUN_RESULT`.


## How it works

The script does the following:

1. Launches docker with given linux distribution
2. Installs copilotbrowser browsers inside the distribution
3. For every dependency that copilotbrowser browsers miss inside the distribution, uses `apt-file` to reverse-search package with the library.
