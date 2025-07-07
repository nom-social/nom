import {
  Html,
  render as renderReactEmail,
  Head,
  Body,
  Preview,
} from "@react-email/components";

type EmailProps = {
  org: string;
  repo: string;
  htmlContent: string;
};

function Email({ org, repo, htmlContent }: EmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body>
        <Preview>
          Your repo highlights for {org}/{repo}
        </Preview>
        {htmlContent}
      </Body>
    </Html>
  );
}

export async function render({ org, repo, htmlContent }: EmailProps) {
  const emailHtml = await renderReactEmail(
    <Email org={org} repo={repo} htmlContent={htmlContent} />
  );

  return emailHtml;
}
