import Foundation
import Network
import Combine

class DiscoveryService: ObservableObject {
    @Published var devices: [Device] = []

    private var browser: NWBrowser?

    func start() {
        let descriptor = NWBrowser.Descriptor.bonjour(type: "_ipadcanvas._tcp", domain: nil)
        let browser = NWBrowser(for: descriptor, using: .tcp)

        browser.browseResultsChangedHandler = { [weak self] results, _ in
            DispatchQueue.main.async {
                self?.devices = results.compactMap { result in
                    switch result.endpoint {
                    case .service(let name, _, _, _):
                        return Device(
                            id: name,
                            name: name,
                            endpoint: result.endpoint
                        )
                    default:
                        return nil
                    }
                }
            }
        }

        browser.stateUpdateHandler = { state in
            switch state {
            case .ready:
                print("[Discovery] Browsing for devices...")
            case .failed(let error):
                print("[Discovery] Error: \(error)")
            default:
                break
            }
        }

        browser.start(queue: .main)
        self.browser = browser
    }

    func stop() {
        browser?.cancel()
        browser = nil
        devices = []
    }
}
