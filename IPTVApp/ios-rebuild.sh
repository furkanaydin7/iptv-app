#!/bin/bash

echo "🧹 Cleaning iOS build..."

# Clean build directories
rm -rf ios/build
rm -rf ios/Pods/
rm -rf ios/IPTVApp.xcworkspace/xcuserdata/
rm -rf ios/IPTVApp.xcodeproj/xcuserdata/
rm -rf ios/DerivedData/

echo "📱 Rebuilding iOS configuration..."

# Reinstall pods
cd ios
pod deintegrate
pod cache clean --all
pod install

echo "🔄 Running prebuild to sync app.json with Info.plist..."
cd ..
npx expo prebuild --platform ios --clean

echo "✅ iOS rebuild complete!"
echo ""
echo "📋 Next steps:"
echo "1. npx expo run:ios --device (for real device)"
echo "2. Check Xcode console for detailed logs"
echo "3. Test M3U playlist addition"
