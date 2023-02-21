import { parseChangelog } from "./changelog";

describe("parseChangelog", () => {
  test("parses with body only", () => {
    // Arrange
    const content = `
    Some random changelog content is here.
    `;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: null,
      bodyContent: "Some random changelog content is here.",
      footerContent: null,
    });
  });

  test("parses with body and footer", () => {
    // Arrange
    const content = `
    Some random changelog content is here.
    ---
    Last ran: 2023-02-19T14:46:41.533Z
    `;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: null,
      bodyContent: expect.stringContaining(
        "Some random changelog content is here.",
      ),
      footerContent: expect.stringContaining(
        "Last ran: 2023-02-19T14:46:41.533Z",
      ),
      lastRan: new Date("2023-02-19T14:46:41.533Z"),
    });
  });

  test("parses with body and header", () => {
    // Arrange
    const content = `
    # Title   
    ---
    Some random changelog content is here.
    `;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: expect.stringContaining("# Title"),
      bodyContent: expect.stringContaining(
        "Some random changelog content is here.",
      ),
      footerContent: null,
    });
  });

  test("parses with header, body and footer", () => {
    // Arrange
    const content = `
    # Title
    ---
    Some random changelog content is here.
    ---
    Last ran: 2023-02-19T14:46:41.533Z`;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: "# Title",
      bodyContent: "Some random changelog content is here.",
      footerContent: "Last ran: 2023-02-19T14:46:41.533Z",
    });
  });

  test("parses single owner", () => {
    // Arrange
    const content = `
    # Title   
    Owner: someowner
    ---
    Some random changelog content is here.
    `;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: expect.stringContaining("# Title"),
      owner: ["someowner"],
    });
  });

  test("parses multiple owners", () => {
    // Arrange
    const content = `
    # Title   
    Owner: someowner,someowner-1, someowner_2
    ---
    Some random changelog content is here.
    `;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: expect.stringContaining("# Title"),
      owner: ["someowner", "someowner-1", "someowner_2"],
    });
  });

  test("parses single notifier", () => {
    // Arrange
    const content = `
    # Title   
    Notify: someuser 
    ---
    Some random changelog content is here.
    `;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: expect.stringContaining("# Title"),
      notify: ["someuser"],
    });
  });

  test("parses multiple notifiers", () => {
    // Arrange
    const content = `
    # Title   
    Notify: someuser,user_1, user-2
    ---
    Some random changelog content is here.
    `;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: expect.stringContaining("# Title"),
      notify: ["someuser", "user_1", "user-2"],
    });
  });

  test("parses invalid last ran date", () => {
    // Arrange
    const content = `
    # Title
    ---
    Some random changelog content is here.
    ---
    Last ran: 21-2023-31
    `;
    // Act
    const result = parseChangelog(content);

    // Assert
    expect(result).toMatchObject({
      headerContent: expect.stringContaining("# Title"),
      footerContent: expect.stringContaining("Last ran"),
      lastRan: null,
    });
  });
});
