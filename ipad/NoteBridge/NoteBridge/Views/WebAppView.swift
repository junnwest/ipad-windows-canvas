import SwiftUI
import WebKit

// WebAppView wraps WKWebView and loads the shared web app for offline mode.
// The shared web app must be added to the Xcode project as a folder reference
// named "shared" — drag the project-root /shared folder into the Xcode
// navigator and choose "Create folder references" (blue folder icon).

struct WebAppView: UIViewRepresentable {

    var devServerURL: String? = nil

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()

        // Register the Swift ↔ JS bridge handler
        // JS calls: window.webkit.messageHandlers.noteBridge.postMessage(json)
        config.userContentController.add(context.coordinator, name: "noteBridge")

        // Inject a helper so the host (this Swift code) can push messages down:
        // window.bridgeReceive(type, data) is called from evaluateJavaScript.
        let script = """
        window.__isWKWebView = true;
        """
        config.userContentController.addUserScript(
            WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.isScrollEnabled = false
        webView.isOpaque = true
        webView.backgroundColor = .white

        context.coordinator.webView = webView
        loadSharedApp(in: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    // ── Load ──────────────────────────────────────────────────────────────────

    private func loadSharedApp(in webView: WKWebView) {
        // Dev mode: load from a local server running on the Windows machine.
        // Start the server with: npm run serve-shared (from desktop/)
        if let urlString = devServerURL, let url = URL(string: urlString) {
            webView.load(URLRequest(url: url))
            return
        }

        if let indexURL = Bundle.main.url(forResource: "index",
                                          withExtension: "html",
                                          subdirectory: "shared") {
            let sharedDir = indexURL.deletingLastPathComponent()
            webView.loadFileURL(indexURL, allowingReadAccessTo: sharedDir)
        } else {
            webView.loadHTMLString(
                """
                <html><body style="display:flex;align-items:center;justify-content:center;
                  height:100vh;font-family:-apple-system;color:#888">
                  <p>Add the <code>shared/</code> folder to Xcode as a folder reference
                  to enable offline note-taking.</p>
                </body></html>
                """,
                baseURL: nil
            )
        }
    }

    // ── Coordinator ───────────────────────────────────────────────────────────

    class Coordinator: NSObject, WKScriptMessageHandler {
        weak var webView: WKWebView?

        // Receives messages from the web app: { type, data }
        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard message.name == "noteBridge",
                  let body = message.body as? String,
                  let jsonData = body.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any],
                  let type = json["type"] as? String
            else { return }

            // In offline mode the web app is self-contained — state is managed
            // entirely within the web app (localStorage for persistence).
            // Phase 2 will add offline ↔ cloud sync.
            switch type {
            case "save_state":
                // Web app already uses its own persistence; nothing to do here yet.
                break
            default:
                break
            }
        }

        // Push a message down from Swift to the web app
        func send(type: String, data: [String: Any]) {
            guard let webView,
                  let jsonData = try? JSONSerialization.data(withJSONObject: data),
                  let jsonString = String(data: jsonData, encoding: .utf8)
            else { return }
            let js = "window.bridgeReceive && window.bridgeReceive('\(type)', \(jsonString))"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}
