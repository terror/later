use {readability::Extractor, std::fs::File, url::Url};

#[test]
fn extract_title() {
  let mut file = File::open("./data/title.html").unwrap();

  let url = Url::parse("https://example.com").unwrap();

  let product = Extractor::default().extract(&mut file, &url).unwrap();

  assert_eq!(product.title, "This is title");
}

#[test]
fn fix_rel_links() {
  let mut file = File::open("./data/rel.html").unwrap();

  let url = Url::parse("https://example.com").unwrap();

  let product = Extractor::default().extract(&mut file, &url).unwrap();

  assert_eq!(
    product.content,
    "<!DOCTYPE html><html><head><title>This is title</title></head><body><p><a href=\"https://example.com/poop\"> poop </a></p></body></html>"
  );
}

#[test]
fn fix_img_links() {
  let mut file = File::open("./data/img.html").unwrap();

  let url = Url::parse("https://example.com").unwrap();

  let product = Extractor::default().extract(&mut file, &url).unwrap();

  assert_eq!(
    product.content,
    "<!DOCTYPE html><html><head><title>This is title</title></head><body><p><img src=\"https://example.com/poop.png\"></p></body></html>"
  );
}
