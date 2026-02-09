import Foundation
import Network

struct Device: Identifiable, Hashable {
    let id: String
    let name: String
    let endpoint: NWEndpoint

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: Device, rhs: Device) -> Bool {
        lhs.id == rhs.id
    }
}
