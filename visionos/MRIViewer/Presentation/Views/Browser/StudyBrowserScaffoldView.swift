import SwiftUI

struct StudyBrowserScaffoldView: View {
    @Bindable var viewModel: UIWorkspaceViewModel

    private let columns = [
        GridItem(.adaptive(minimum: 260, maximum: 410), spacing: 14),
    ]

    var body: some View {
        VStack(spacing: 14) {
            browserToolbar

            ScrollView {
                LazyVGrid(columns: columns, spacing: 14) {
                    AddStudyCard(title: "Add a new person")
                    AddStudyCard(title: "Import a study") {
                        viewModel.selectSection(.loadData)
                    }

                    ForEach(viewModel.filteredStudies) { study in
                        StudyCardView(
                            study: study,
                            isSelected: viewModel.selectedStudyID == study.id
                        ) {
                            viewModel.selectStudy(study)
                        }
                    }
                }
                .padding(14)

                if viewModel.filteredStudies.isEmpty {
                    EmptyWorkspaceView(
                        symbol: "magnifyingglass",
                        title: "No studies found",
                        message: "Try another patient name, MRN, region, or status filter."
                    )
                    .frame(minHeight: 330)
                } else {
                    PaginationView(page: $viewModel.currentPage)
                        .padding(.top, 4)
                        .padding(.bottom, 94)
                }
            }
        }
        .background(ScaffoldTheme.background.opacity(0.66))
    }

    private var browserToolbar: some View {
        HStack(spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(ScaffoldTheme.secondaryText)
                TextField("Search patient, MRN, accession…", text: $viewModel.searchText)
                    .textFieldStyle(.plain)
                    .font(.system(size: 16))
            }
            .padding(.horizontal, 16)
            .frame(height: 52)
            .background(Color.white.opacity(0.07), in: Rectangle())

            HStack(spacing: 5) {
                ForEach(StudyFilter.allCases) { filter in
                    Button {
                        viewModel.selectedFilter = filter
                    } label: {
                        Text(filter.title)
                            .font(.system(size: 11, weight: .bold))
                            .lineLimit(1)
                            .foregroundStyle(viewModel.selectedFilter == filter ? Color.white : ScaffoldTheme.secondaryText)
                            .frame(minWidth: 68, minHeight: 38)
                            .background(
                                viewModel.selectedFilter == filter ? ScaffoldTheme.accent : Color.white.opacity(0.035),
                                in: Rectangle()
                            )
                    }
                    .buttonStyle(ScaffoldButtonStyle())
                    .accessibilityAddTraits(viewModel.selectedFilter == filter ? .isSelected : [])
                }
            }
            .padding(6)
            .background(Color.white.opacity(0.045), in: Rectangle())
        }
        .padding(12)
        .scaffoldPanel(raised: true)
    }
}

private struct AddStudyCard: View {
    let title: String
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: "plus.circle")
                    .font(.system(size: 28, weight: .light))
                    .foregroundStyle(ScaffoldTheme.accentBright)
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.72))
            }
            .frame(maxWidth: .infinity, minHeight: 226)
            .background(Color.white.opacity(0.055), in: Rectangle())
            .overlay {
                Rectangle()
                    .stroke(Color.white.opacity(0.10), style: StrokeStyle(lineWidth: 1, dash: [7, 5]))
            }
        }
        .buttonStyle(ScaffoldButtonStyle())
    }
}

private struct StudyCardView: View {
    let study: StudyCardModel
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                ScanPlaceholderView(seed: study.thumbnailSeed)
                    .frame(height: 118)

                HStack(alignment: .firstTextBaseline) {
                    Text(study.patientName)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(Color.black.opacity(0.82))
                        .lineLimit(1)
                    Spacer()
                    Text("MRN  \(study.mrn)")
                        .font(.system(size: 9, weight: .medium, design: .monospaced))
                        .foregroundStyle(Color.black.opacity(0.32))
                }

                HStack(spacing: 7) {
                    MetadataTag(text: study.modality)
                    MetadataTag(text: study.bodyRegion)
                    MetadataTag(text: study.status.rawValue, emphasized: true)
                    if study.isFlagged {
                        Image(systemName: "flag.fill")
                            .font(.caption2)
                            .foregroundStyle(.orange)
                            .accessibilityLabel("Flagged")
                    }
                }

                Divider().overlay(Color.black.opacity(0.10))

                HStack {
                    Text(study.date)
                        .font(.caption)
                        .foregroundStyle(Color.black.opacity(0.48))
                    Spacer()
                    HStack(spacing: 4) {
                        Text("Open")
                        Image(systemName: "arrow.right")
                    }
                    .font(.caption.weight(.bold))
                    .foregroundStyle(ScaffoldTheme.accentBright)
                }
            }
            .padding(12)
            .background(isSelected ? Color(red: 0.78, green: 0.89, blue: 0.98) : Color.white.opacity(0.92), in: Rectangle())
            .environment(\.colorScheme, .light)
            .overlay {
                Rectangle()
                    .stroke(isSelected ? ScaffoldTheme.accentBright : Color.clear, lineWidth: 3)
            }
        }
        .buttonStyle(ScaffoldButtonStyle())
        .accessibilityLabel("\(study.patientName), \(study.modality) \(study.bodyRegion), \(study.status.rawValue)")
        .accessibilityHint("Open the multi-planar viewer")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

private struct MetadataTag: View {
    let text: String
    var emphasized = false

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: emphasized ? .semibold : .regular))
            .foregroundStyle(emphasized ? ScaffoldTheme.accent : Color.black.opacity(0.64))
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(
                emphasized ? ScaffoldTheme.accent.opacity(0.09) : Color.black.opacity(0.035),
                in: Rectangle()
            )
            .overlay {
                if emphasized {
                    Rectangle()
                        .stroke(ScaffoldTheme.accent.opacity(0.65), lineWidth: 1)
                }
            }
    }
}

private struct PaginationView: View {
    @Binding var page: Int

    var body: some View {
        HStack(spacing: 8) {
            Button {
                page = max(1, page - 1)
            } label: {
                Label("Prev", systemImage: "arrow.left")
            }
            .disabled(page == 1)

            ForEach(1...3, id: \.self) { value in
                Button { page = value } label: {
                    Text("\(value)")
                        .frame(width: 36, height: 36)
                        .background(
                            page == value ? ScaffoldTheme.accent : Color.white.opacity(0.05),
                            in: Rectangle()
                        )
                }
                .buttonStyle(ScaffoldButtonStyle())
                .accessibilityAddTraits(page == value ? .isSelected : [])
            }

            Button {
                page = min(3, page + 1)
            } label: {
                Label("Next", systemImage: "arrow.right")
                    .labelStyle(.titleAndIcon)
            }
            .disabled(page == 3)
        }
        .font(.caption.weight(.semibold))
        .foregroundStyle(ScaffoldTheme.secondaryText)
    }
}
