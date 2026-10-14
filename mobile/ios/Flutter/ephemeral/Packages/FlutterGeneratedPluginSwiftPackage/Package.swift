// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.
//
// Generated file. Do not edit.
//

import PackageDescription

let package = Package(
    name: "FlutterGeneratedPluginSwiftPackage",
    platforms: [
        .iOS("15.0")
    ],
    products: [
        .library(name: "FlutterGeneratedPluginSwiftPackage", type: .static, targets: ["FlutterGeneratedPluginSwiftPackage"])
    ],
    dependencies: [
        .package(name: "camera_avfoundation", path: "../.packages/camera_avfoundation-0.10.2"),
        .package(name: "file_picker_darwin", path: "../.packages/file_picker_darwin-2.1.2"),
        .package(name: "firebase_core", path: "../.packages/firebase_core-4.15.0"),
        .package(name: "firebase_messaging", path: "../.packages/firebase_messaging-16.7.0"),
        .package(name: "flutter_secure_storage_darwin", path: "../.packages/flutter_secure_storage_darwin-0.3.2"),
        .package(name: "image_picker_ios", path: "../.packages/image_picker_ios-0.8.13+6"),
        .package(name: "pdfium_flutter", path: "../.packages/pdfium_flutter-0.3.1"),
        .package(name: "url_launcher_ios", path: "../.packages/url_launcher_ios-6.4.1"),
        .package(name: "FlutterFramework", path: "../.packages/FlutterFramework")
    ],
    targets: [
        .target(
            name: "FlutterGeneratedPluginSwiftPackage",
            dependencies: [
                .product(name: "camera-avfoundation", package: "camera_avfoundation"),
                .product(name: "file-picker-darwin", package: "file_picker_darwin"),
                .product(name: "firebase-core", package: "firebase_core"),
                .product(name: "firebase-messaging", package: "firebase_messaging"),
                .product(name: "flutter-secure-storage-darwin", package: "flutter_secure_storage_darwin"),
                .product(name: "image-picker-ios", package: "image_picker_ios"),
                .product(name: "pdfium-flutter", package: "pdfium_flutter"),
                .product(name: "url-launcher-ios", package: "url_launcher_ios"),
                .product(name: "FlutterFramework", package: "FlutterFramework")
            ]
        )
    ]
)
