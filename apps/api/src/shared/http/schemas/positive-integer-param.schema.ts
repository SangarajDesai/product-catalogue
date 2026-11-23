import { z } from "zod";

export const positiveIntegerParamSchema = z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.int().positive());
