set(copilotbrowser_DIR "${TOOLS_DIR}/copilotbrowser/mac")

#FIXME: This should not need WEBCORE_EXPORT defined.  This means we are including WebCore headers, and we should not.
add_definitions("-include copilotbrowser_Prefix.pch -DWEBCORE_EXPORT=")

set(copilotbrowser_SOURCES
    ${copilotbrowser_DIR}/AppDelegate.m
    ${copilotbrowser_DIR}/BrowserWindowController.m
    ${copilotbrowser_DIR}/main.m
    ${TOOLS_DIR}/copilotbrowser/MBToolbarItem.m
)

set(copilotbrowser_INCLUDE_DIRECTORIES
    ${CMAKE_SOURCE_DIR}/Source
    ${FORWARDING_HEADERS_DIR}
    ${copilotbrowser_DIR}
)

set(copilotbrowser_LIBRARIES
    WebKit
)

set(CMAKE_EXE_LINKER_FLAGS "-framework Cocoa")

set(EXECUTABLE_NAME copilotbrowser)
set(PRODUCT_NAME copilotbrowser)

set(copilotbrowser_Contents_Directory ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/copilotbrowser.app/Contents)
make_directory(${copilotbrowser_Contents_Directory}/Resources)
add_custom_command(OUTPUT ${copilotbrowser_Contents_Directory}/Resources/BrowserWindow.nib
    COMMAND ibtool --compile ${copilotbrowser_Contents_Directory}/Resources/BrowserWindow.nib ${copilotbrowser_DIR}/BrowserWindow.xib VERBATIM)
add_custom_command(OUTPUT ${copilotbrowser_Contents_Directory}/Resources/MainMenu.nib
    COMMAND ibtool --compile ${copilotbrowser_Contents_Directory}/Resources/MainMenu.nib ${copilotbrowser_DIR}/MainMenu.xib VERBATIM)
add_custom_target(copilotbrowserNibs ALL DEPENDS
    ${copilotbrowser_Contents_Directory}/Resources/BrowserWindow.nib
    ${copilotbrowser_Contents_Directory}/Resources/MainMenu.nib
)

include_directories(${copilotbrowser_INCLUDE_DIRECTORIES})
add_executable(copilotbrowser MACOSX_BUNDLE ${copilotbrowser_SOURCES})
set_target_properties(copilotbrowser PROPERTIES MACOSX_BUNDLE_INFO_PLIST ${copilotbrowser_DIR}/Info.plist)
target_link_libraries(copilotbrowser ${copilotbrowser_LIBRARIES})
add_dependencies(copilotbrowser copilotbrowserNibs)
