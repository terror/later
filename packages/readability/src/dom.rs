use super::*;

pub(crate) fn get_tag_name(handle: Handle) -> Option<String> {
  match handle.data {
    NodeData::Element { ref name, .. } => {
      Some(name.local.as_ref().to_lowercase().to_string())
    }
    _ => None,
  }
}

pub(crate) fn get_attr(name: &str, handle: Handle) -> Option<String> {
  match handle.data {
    NodeData::Element {
      name: _, ref attrs, ..
    } => attr(name, &attrs.borrow()),
    _ => None,
  }
}

pub(crate) fn attr(attr_name: &str, attrs: &[Attribute]) -> Option<String> {
  for attr in attrs.iter() {
    if attr.name.local.as_ref() == attr_name {
      return Some(attr.value.to_string());
    }
  }

  None
}

pub(crate) fn set_attr(attr_name: &str, value: &str, handle: Handle) {
  if let NodeData::Element {
    name: _, ref attrs, ..
  } = handle.data
  {
    let mut attrs = attrs.borrow_mut();

    if let Some(index) = attrs.iter().position(|attr| {
      let name = attr.name.local.as_ref();
      name == attr_name
    }) && let Ok(value) = StrTendril::from_str(value)
    {
      attrs[index] = Attribute {
        name: attrs[index].name.clone(),
        value,
      }
    }
  }
}

pub(crate) fn clean_attr(attr_name: &str, attrs: &mut Vec<Attribute>) {
  if let Some(index) = attrs.iter().position(|attr| {
    let name = attr.name.local.as_ref();
    name == attr_name
  }) {
    attrs.remove(index);
  }
}

pub(crate) fn is_empty(handle: Handle) -> bool {
  for child in handle.children.borrow().iter() {
    let c = child.clone();

    match c.data {
      NodeData::Text { ref contents } => {
        if contents.borrow().trim().len() > 0 {
          return false;
        }
      }
      NodeData::Element { ref name, .. } => {
        let tag_name = name.local.as_ref();

        match tag_name.to_lowercase().as_ref() {
          "li" | "dt" | "dd" | "p" | "div" => {
            if !is_empty(child.clone()) {
              return false;
            }
          }
          _ => return false,
        }
      }
      _ => (),
    }
  }

  matches!(
    get_tag_name(handle.clone()).unwrap_or_default().as_ref(),
    "li" | "dt" | "dd" | "p" | "div" | "canvas"
  )
}

pub(crate) fn extract_text(handle: Handle, text: &mut String, deep: bool) {
  for child in handle.children.borrow().iter() {
    let c = child.clone();

    match c.data {
      NodeData::Text { ref contents } => {
        text.push_str(contents.borrow().as_ref());
      }
      NodeData::Element { .. } => {
        if deep {
          extract_text(child.clone(), text, deep);
        }
      }
      _ => (),
    }
  }
}

pub(crate) fn text_len(handle: Handle) -> usize {
  let mut len = 0;

  for child in handle.children.borrow().iter() {
    let c = child.clone();

    match c.data {
      NodeData::Text { ref contents } => {
        len += contents.borrow().trim().chars().count();
      }
      NodeData::Element { .. } => {
        len += text_len(child.clone());
      }
      _ => (),
    }
  }

  len
}

pub(crate) fn find_node(
  handle: Handle,
  tag_name: &str,
  nodes: &mut Vec<Rc<Node>>,
) {
  for child in handle.children.borrow().iter() {
    let c = child.clone();

    if let NodeData::Element { ref name, .. } = c.data {
      let t = name.local.as_ref();

      if t.to_lowercase() == tag_name {
        nodes.push(child.clone());
      };

      find_node(child.clone(), tag_name, nodes)
    }
  }
}

pub(crate) fn has_nodes(handle: Handle, tag_names: &[&'static str]) -> bool {
  for child in handle.children.borrow().iter() {
    let tag_name: &str = &get_tag_name(child.clone()).unwrap_or_default();

    if tag_names.contains(&tag_name) {
      return true;
    }

    if match child.clone().data {
      NodeData::Element { .. } => has_nodes(child.clone(), tag_names),
      _ => false,
    } {
      return true;
    }
  }

  false
}

pub(crate) fn text_children_count(handle: Handle) -> usize {
  let mut count = 0;

  for child in handle.children.borrow().iter() {
    let c = child.clone();

    if let NodeData::Text { ref contents } = c.data {
      let s = contents.borrow();

      if s.trim().len() >= 20 {
        count += 1
      }
    }
  }

  count
}

#[cfg(test)]
mod tests {
  use {
    super::*,
    html5ever::{parse_document, tendril::stream::TendrilSink},
    std::io::Cursor,
  };

  fn parse_html(html: &str) -> RcDom {
    let mut cursor = Cursor::new(html.as_bytes());

    parse_document(RcDom::default(), Default::default())
      .from_utf8()
      .read_from(&mut cursor)
      .expect("failed to parse fixture")
  }

  fn find_element(handle: Handle, tag: &str) -> Option<Handle> {
    for child in handle.children.borrow().iter() {
      if let NodeData::Element { ref name, .. } = child.data {
        let candidate = name.local.as_ref();

        if candidate == tag {
          return Some(child.clone());
        }

        if let Some(found) = find_element(child.clone(), tag) {
          return Some(found);
        }
      }
    }

    None
  }

  #[test]
  fn get_tag_name_normalizes_case() {
    let dom = parse_html("<DIV id=\"sample\">Hello</DIV>");

    let div = find_element(dom.document.clone(), "div").unwrap();

    assert_eq!(get_tag_name(div), Some(String::from("div")));
  }

  #[test]
  fn set_attr_overwrites_existing_value() {
    let dom = parse_html("<img src=\"/image.png\">");

    let img = find_element(dom.document.clone(), "img").unwrap();

    set_attr("src", "https://example.com/image.png", img.clone());

    assert_eq!(
      get_attr("src", img).as_deref(),
      Some("https://example.com/image.png")
    );
  }

  #[test]
  fn is_empty_detects_blank_containers() {
    let dom = parse_html("<div><div>   </div></div>");

    let div = find_element(dom.document.clone(), "div").unwrap();

    assert!(is_empty(div));
  }

  #[test]
  fn extract_text_respects_depth_flag() {
    let dom = parse_html("<div>outside<span>inside</span></div>");

    let div = find_element(dom.document.clone(), "div").unwrap();

    let mut shallow = String::new();
    extract_text(div.clone(), &mut shallow, false);
    assert_eq!(shallow, "outside");

    let mut deep = String::new();
    extract_text(div, &mut deep, true);
    assert_eq!(deep, "outsideinside");
  }
}
