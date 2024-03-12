import React from 'react';

import { MetaTags } from '@eto/social-cards';
import socialCard from '@eto/social-cards/dist/tools/orca.png';

const MetaTagsWrapper = ({
  title = "ORCA \u2013 Emerging Technology Observatory",
  subtitle = undefined,
  description = "compiles data on open-source software (OSS) used in science and technology research."
}) => {
  const fullTitle = subtitle ? `${subtitle} \u2013 ${title}` : title;

  return (
    <>
      <title>{fullTitle}</title>
      <html lang="en" />
      <MetaTags
        title={fullTitle}
        description={description}
        socialCardUrl={socialCard}
      />
    </>
  );
};

export default MetaTagsWrapper;
