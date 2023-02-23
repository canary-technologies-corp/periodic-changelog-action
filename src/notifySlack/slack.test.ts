import { convertMarkdownLinksToSlackStyle } from "./slack";

describe("convertMarkdownLinksToSlackStyle", () => {
  test("returns original when no links are present", () => {
    // Arrange
    const content = "This string has no links [but] some (characters)";

    // Act
    const result = convertMarkdownLinksToSlackStyle(content);

    // Assert
    expect(result).toEqual(content);
  });

  test("converts a single link", () => {
    // Arrange
    const content = "This string has a [link](example.com) inside.";

    // Act
    const result = convertMarkdownLinksToSlackStyle(content);

    // Assert
    expect(result).toEqual("This string has a <example.com|link> inside.");
  });

  test("converts multiple links", () => {
    // Arrange
    const content =
      "This string has [1](example.com) and [2](example.com) inside.";

    // Act
    const result = convertMarkdownLinksToSlackStyle(content);

    // Assert
    expect(result).toEqual(
      "This string has <example.com|1> and <example.com|2> inside.",
    );
  });
});
