# Homebrew formula for OurSQL.
# Distribute via a tap:  brew tap ashiqfardus/OurSQL && brew install oursql
#
# After `npm publish`, fill in the sha256:
#   curl -sL https://registry.npmjs.org/oursql/-/oursql-1.0.0.tgz | shasum -a 256
# (If you publish under a scope, use the scoped tarball URL and name.)

class Oursql < Formula
  desc "OurSQL — the communal database. It's MySQL underneath; we just agreed to share."
  homepage "https://github.com/ashiqfardus/OurSQL"
  url "https://registry.npmjs.org/oursql/-/oursql-1.0.0.tgz"
  sha256 "REPLACE_WITH_TARBALL_SHA256"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "OurSQL", shell_output("#{bin}/oursql --version 2>&1", 127)
  end
end
