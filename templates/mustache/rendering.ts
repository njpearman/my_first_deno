import Mustache from "https://raw.githubusercontent.com/janl/mustache.js/v4.0.1/mustache.mjs";

class MustacheTemplateError extends Deno.errors.NotFound {
  constructor(templateName: string, cause: Error) {
    super(
      `Unable to read mustache template ${templateName}. Underlying error: ${cause}`,
    );
  }
}

/**
 * Using `Mustache` here produces a TS error in Vim:
 * Cannot invoke an object that is possibly undefined.
 *
 * However, Deno runs happily with this code. I've tried to hunt around for the reason that it
 * happens and can't find anything. It might be because the language server implementation doesn't
 * know how to handle external imports fully, or because I'm not strictly importing the module
 * correctly.
 **/
export const renderMustacheTemplate = async (
  template: string,
  templateName: string,
  values: object = {},
) => {
  try {
    return Mustache.render(template, values);
  } catch (err) {
    throw new MustacheTemplateError(templateName, err);
  }
};
