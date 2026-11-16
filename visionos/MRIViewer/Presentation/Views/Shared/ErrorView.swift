import SwiftUI

struct ErrorView: View {
    let error: DICOMError
    var onRetry: (() -> Void)?

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundStyle(.orange)

            Text(error.localizedDescription ?? "Unknown error")
                .multilineTextAlignment(.center)
                .foregroundStyle(.primary)

            if let retry = onRetry {
                Button("Retry", action: retry)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding(32)
    }
}
