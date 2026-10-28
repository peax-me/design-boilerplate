import { Grid } from "@repo/ui/layout/grid";
import { Text } from "@repo/ui/typography/text";

import { renegadeSteps } from "./renegade-steps";

export function RenegadeCaptions() {
  return (
    <Grid as="ol" columns="3" from="lg" gap="lg">
      {renegadeSteps.map((step, index) => (
        <Text as="li" key={step} data-scene-item={`step-${index}`}>
          {step}
        </Text>
      ))}
    </Grid>
  );
}
