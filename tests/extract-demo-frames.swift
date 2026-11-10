import Foundation
import AVFoundation
import AppKit
let args = CommandLine.arguments
let source = URL(fileURLWithPath: args[1])
let directory = URL(fileURLWithPath: args[2], isDirectory: true)
let asset = AVURLAsset(url: source)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
for (name, seconds) in [("typing", 2.0), ("blank-paper", 28.8), ("list-appear", 31.8), ("checked", 44.8)] {
    let image = try generator.copyCGImage(at: CMTime(seconds: seconds, preferredTimescale: 600), actualTime: nil)
    let bitmap = NSBitmapImageRep(cgImage: image)
    let data = bitmap.representation(using: .png, properties: [:])!
    try data.write(to: directory.appendingPathComponent("reference-\(name).png"))
}
let track = asset.tracks(withMediaType: .video).first!
let size = track.naturalSize.applying(track.preferredTransform)
let metadata: [String: Any] = ["duration": CMTimeGetSeconds(asset.duration), "width": abs(size.width), "height": abs(size.height), "fps": track.nominalFrameRate, "audioTracks": asset.tracks(withMediaType: .audio).count]
try JSONSerialization.data(withJSONObject: metadata, options: [.prettyPrinted, .sortedKeys]).write(to: directory.appendingPathComponent("reference-metadata.json"))
print("Read four exact frames from the author MP4")
