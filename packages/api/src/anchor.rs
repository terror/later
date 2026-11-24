const CONTEXT_CHARS: usize = 32;

#[derive(Debug, PartialEq)]
pub(crate) struct Anchor<'a> {
  pub(crate) context_after: &'a str,
  pub(crate) context_before: &'a str,
  pub(crate) selected_text: &'a str,
}

impl<'a> Anchor<'a> {
  pub(crate) fn new(text: &'a str, start: i32, end: i32) -> Option<Self> {
    let start = byte_index(text, usize::try_from(start).ok()?)?;

    let end = byte_index(text, usize::try_from(end).ok()?)?;

    if start >= end {
      return None;
    }

    let before = &text[..start];

    let after = &text[end..];

    Some(Self {
      context_after: &after[..after
        .char_indices()
        .nth(CONTEXT_CHARS)
        .map_or(after.len(), |(index, _)| index)],
      context_before: &before[before
        .char_indices()
        .rev()
        .nth(CONTEXT_CHARS - 1)
        .map_or(0, |(index, _)| index)..],
      selected_text: &text[start..end],
    })
  }
}

fn byte_index(text: &str, offset: usize) -> Option<usize> {
  let mut utf16 = 0;

  for (index, character) in text.char_indices() {
    if utf16 == offset {
      return Some(index);
    }

    utf16 += character.len_utf16();

    if utf16 > offset {
      return None;
    }
  }

  (utf16 == offset).then_some(text.len())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn new() {
    #[track_caller]
    fn case(
      text: &str,
      start: i32,
      end: i32,
      expected: Option<(&str, &str, &str)>,
    ) {
      assert_eq!(
        Anchor::new(text, start, end),
        expected.map(|(context_before, selected_text, context_after)| {
          Anchor {
            context_after,
            context_before,
            selected_text,
          }
        }),
      );
    }

    case("foo bar baz", 4, 7, Some(("foo ", "bar", " baz")));
    case("foo", 0, 3, Some(("", "foo", "")));
    case("😀 foo 😀", 3, 6, Some(("😀 ", "foo", " 😀")));
    case("😀 foo", 1, 6, None);
    case("foo", 1, 1, None);
    case("foo", 2, 1, None);
    case("foo", 0, 4, None);
    case("foo", -1, 3, None);

    let a = "a".repeat(CONTEXT_CHARS);
    let b = "b".repeat(CONTEXT_CHARS);

    case(
      &format!("a{a}foo{b}b"),
      33,
      36,
      Some((a.as_str(), "foo", b.as_str())),
    );
  }
}
