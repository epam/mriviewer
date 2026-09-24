import SwiftUI

enum ScaffoldTheme {
    static let accent = Color(red: 0.34, green: 0.58, blue: 0.79)
    static let accentBright = Color(red: 0.43, green: 0.70, blue: 0.94)
    static let background = Color(red: 0.025, green: 0.035, blue: 0.05)
    static let panel = Color(red: 0.075, green: 0.095, blue: 0.125)
    static let panelRaised = Color(red: 0.10, green: 0.125, blue: 0.16)
    static let viewport = Color(red: 0.025, green: 0.045, blue: 0.065)
    static let border = Color.white.opacity(0.11)
    static let secondaryText = Color.white.opacity(0.58)
}

struct ScaffoldPanelModifier: ViewModifier {
    let cornerRadius: CGFloat
    let raised: Bool

    func body(content: Content) -> some View {
        content
            .background(
                (raised ? ScaffoldTheme.panelRaised : ScaffoldTheme.panel).opacity(0.92),
                in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            )
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(ScaffoldTheme.border, lineWidth: 1)
            }
    }
}

extension View {
    func scaffoldPanel(cornerRadius: CGFloat = 22, raised: Bool = false) -> some View {
        modifier(ScaffoldPanelModifier(cornerRadius: cornerRadius, raised: raised))
    }
}

struct BrandLockupView: View {
    var compact = false

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(ScaffoldTheme.accent.opacity(0.16))
                Image(systemName: "brain.head.profile")
                    .font(.system(size: compact ? 18 : 24, weight: .semibold))
                    .foregroundStyle(ScaffoldTheme.accentBright)
            }
            .frame(width: compact ? 42 : 50, height: compact ? 42 : 50)

            if !compact {
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: 5) {
                        Text("MRI")
                            .foregroundStyle(ScaffoldTheme.accentBright)
                        Text("VIEWER")
                            .foregroundStyle(.white)
                    }
                    .font(.system(size: 21, weight: .bold, design: .rounded))

                    Text("SEE MORE. KNOW MORE.")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(ScaffoldTheme.accentBright)
                        .tracking(0.5)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("MRI Viewer. See more. Know more.")
    }
}

struct ScanPlaceholderView: View {
    let seed: Int
    var plane: AnatomicalPlaneLabel = .axial
    var showsGrid = false

    private var symbol: String {
        switch plane {
        case .axial: "brain"
        case .sagittal: "brain.head.profile"
        case .coronal: "person.crop.rectangle"
        }
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.025, green: 0.06, blue: 0.09),
                        Color(red: 0.04, green: 0.11, blue: 0.16),
                        Color(red: 0.015, green: 0.025, blue: 0.04),
                    ],
                    startPoint: seed.isMultiple(of: 2) ? .topLeading : .topTrailing,
                    endPoint: .bottomTrailing
                )

                Circle()
                    .fill(ScaffoldTheme.accent.opacity(0.10))
                    .frame(width: min(proxy.size.width, proxy.size.height) * 0.65)
                    .blur(radius: 24)

                Image(systemName: symbol)
                    .resizable()
                    .scaledToFit()
                    .frame(
                        width: min(proxy.size.width * 0.52, proxy.size.height * 0.66),
                        height: min(proxy.size.width * 0.52, proxy.size.height * 0.66)
                    )
                    .fontWeight(.ultraLight)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.white.opacity(0.74), ScaffoldTheme.accentBright.opacity(0.34)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .shadow(color: ScaffoldTheme.accent.opacity(0.4), radius: 30)

                if showsGrid {
                    Path { path in
                        path.move(to: CGPoint(x: proxy.size.width / 2, y: 0))
                        path.addLine(to: CGPoint(x: proxy.size.width / 2, y: proxy.size.height))
                        path.move(to: CGPoint(x: 0, y: proxy.size.height / 2))
                        path.addLine(to: CGPoint(x: proxy.size.width, y: proxy.size.height / 2))
                    }
                    .stroke(ScaffoldTheme.accentBright.opacity(0.45), style: StrokeStyle(lineWidth: 1, dash: [5, 5]))
                }

                Text("DUMMY SCAN")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .tracking(1.2)
                    .foregroundStyle(.white.opacity(0.32))
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .padding(12)
            }
            .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
        }
        .accessibilityLabel("Placeholder medical scan")
    }
}

struct SectionEyebrow: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 12, weight: .bold))
            .tracking(1)
            .foregroundStyle(ScaffoldTheme.accentBright)
    }
}

struct EmptyWorkspaceView: View {
    let symbol: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: symbol)
                .font(.system(size: 48, weight: .light))
                .foregroundStyle(ScaffoldTheme.accentBright)
            Text(title)
                .font(.title2.bold())
            Text(message)
                .font(.body)
                .foregroundStyle(ScaffoldTheme.secondaryText)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 460)
        }
        .padding(48)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
