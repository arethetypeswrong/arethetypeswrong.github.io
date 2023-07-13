export default function Footer() {
  return (
    <footer style={{ position: "fixed", bottom: 10 }}>
      <span>
        core:
        <a
          id="core-version"
          href="https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/packages/core/CHANGELOG.md"
        >
          v0.6.0
        </a>
      </span>
      <span>
        web:
        <a id="web-version" href="https://github.com/arethetypeswrong/arethetypeswrong.github.io/commit/aea47a5">
          aea47a5
        </a>
      </span>
      <span>
        typescript:
        <span id="ts-version">v5.1.3</span>
      </span>
    </footer>
  );
}
