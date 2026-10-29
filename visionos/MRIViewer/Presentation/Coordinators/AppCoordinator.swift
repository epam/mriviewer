import Foundation
import SwiftUI

/// Central navigation controller. Only place that calls openImmersiveSpace / dismissImmersiveSpace.
@MainActor
@Observable
final class AppCoordinator {
    var selectedSeries: DICOMSeries?
    var isImmersiveSpaceOpen = false

    private(set) var openImmersiveSpaceAction: OpenImmersiveSpaceAction?
    private(set) var dismissImmersiveSpaceAction: DismissImmersiveSpaceAction?

    func configure(
        open: OpenImmersiveSpaceAction,
        dismiss: DismissImmersiveSpaceAction
    ) {
        self.openImmersiveSpaceAction    = open
        self.dismissImmersiveSpaceAction = dismiss
    }

    func openVolumeViewer(series: DICOMSeries) async {
        selectedSeries = series
        guard let action = openImmersiveSpaceAction else { return }
        let result = await action(id: "VolumeViewer")
        switch result {
        case .opened:
            isImmersiveSpaceOpen = true
        case .userCancelled, .error:
            isImmersiveSpaceOpen = false
        @unknown default:
            break
        }
    }

    func closeVolumeViewer() async {
        guard let action = dismissImmersiveSpaceAction else { return }
        await action()
        isImmersiveSpaceOpen = false
        selectedSeries = nil
    }
}
