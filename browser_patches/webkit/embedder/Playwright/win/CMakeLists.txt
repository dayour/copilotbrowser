set(copilotbrowser_PRIVATE_INCLUDE_DIRECTORIES
    ${CMAKE_BINARY_DIR}
    ${WebCore_PRIVATE_FRAMEWORK_HEADERS_DIR}
)

set(copilotbrowser_SOURCES
    Common.cpp
    MainWindow.cpp
    copilotbrowserLib.rc
    WebKitBrowserWindow.cpp
    WinMain.cpp
    stdafx.cpp
)

set(copilotbrowser_PRIVATE_DEFINITIONS _UNICODE)
set(copilotbrowser_PRIVATE_LIBRARIES
    WebKit::WTF
    comctl32
    shlwapi
    user32
)

list(APPEND copilotbrowser_PRIVATE_DEFINITIONS ENABLE_WEBKIT)
list(APPEND copilotbrowser_SOURCES
    WebKitBrowserWindow.cpp
)
list(APPEND copilotbrowser_PRIVATE_LIBRARIES
    WebKit::WebKit
)

WEBKIT_EXECUTABLE_DECLARE(copilotbrowser)
WEBKIT_EXECUTABLE(copilotbrowser)

set_target_properties(copilotbrowser PROPERTIES WIN32_EXECUTABLE ON)
if (${WTF_PLATFORM_WIN_CAIRO})
    target_compile_definitions(copilotbrowser PRIVATE WIN_CAIRO)
endif ()
