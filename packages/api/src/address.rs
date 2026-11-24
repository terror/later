use super::*;

const BLOCKED_IPV4: &[(Ipv4Addr, u32)] = &[
  (Ipv4Addr::new(0, 0, 0, 0), 8),
  (Ipv4Addr::new(10, 0, 0, 0), 8),
  (Ipv4Addr::new(100, 64, 0, 0), 10),
  (Ipv4Addr::new(127, 0, 0, 0), 8),
  (Ipv4Addr::new(169, 254, 0, 0), 16),
  (Ipv4Addr::new(172, 16, 0, 0), 12),
  (Ipv4Addr::new(192, 0, 0, 0), 24),
  (Ipv4Addr::new(192, 0, 2, 0), 24),
  (Ipv4Addr::new(192, 88, 99, 0), 24),
  (Ipv4Addr::new(192, 168, 0, 0), 16),
  (Ipv4Addr::new(198, 18, 0, 0), 15),
  (Ipv4Addr::new(198, 51, 100, 0), 24),
  (Ipv4Addr::new(203, 0, 113, 0), 24),
  (Ipv4Addr::new(224, 0, 0, 0), 4),
  (Ipv4Addr::new(240, 0, 0, 0), 4),
];

const GLOBAL_IPV6: (Ipv6Addr, u32) =
  (Ipv6Addr::new(0x2000, 0, 0, 0, 0, 0, 0, 0), 3);

const BLOCKED_IPV6: &[(Ipv6Addr, u32)] = &[
  (Ipv6Addr::new(0x2001, 0, 0, 0, 0, 0, 0, 0), 23),
  (Ipv6Addr::new(0x2001, 0xdb8, 0, 0, 0, 0, 0, 0), 32),
  (Ipv6Addr::new(0x2002, 0, 0, 0, 0, 0, 0, 0), 16),
  (Ipv6Addr::new(0x3fff, 0, 0, 0, 0, 0, 0, 0), 20),
];

fn in_ipv4(ip: Ipv4Addr, (network, prefix): (Ipv4Addr, u32)) -> bool {
  let mask = u32::MAX.checked_shl(32 - prefix).unwrap_or(0);
  u32::from(ip) & mask == u32::from(network) & mask
}

fn in_ipv6(ip: Ipv6Addr, (network, prefix): (Ipv6Addr, u32)) -> bool {
  let mask = u128::MAX.checked_shl(128 - prefix).unwrap_or(0);
  u128::from(ip) & mask == u128::from(network) & mask
}

pub(crate) fn is_public(ip: IpAddr) -> bool {
  match ip {
    IpAddr::V4(ip) => !BLOCKED_IPV4.iter().any(|&block| in_ipv4(ip, block)),
    IpAddr::V6(ip) => {
      in_ipv6(ip, GLOBAL_IPV6)
        && !BLOCKED_IPV6.iter().any(|&block| in_ipv6(ip, block))
    }
  }
}

#[cfg(test)]
mod tests {
  #[test]
  fn is_public() {
    #[track_caller]
    fn case(ip: &str, expected: bool) {
      assert_eq!(super::is_public(ip.parse().unwrap()), expected, "{ip}");
    }

    case("1.1.1.1", true);
    case("8.8.8.8", true);
    case("93.184.215.14", true);
    case("100.63.255.255", true);
    case("100.128.0.0", true);
    case("172.15.255.255", true);
    case("172.32.0.0", true);
    case("192.0.1.0", true);
    case("192.167.255.255", true);
    case("198.17.255.255", true);
    case("198.20.0.0", true);
    case("223.255.255.255", true);

    case("0.0.0.0", false);
    case("0.1.2.3", false);
    case("10.0.0.1", false);
    case("10.255.255.255", false);
    case("100.64.0.1", false);
    case("100.100.100.200", false);
    case("100.127.255.255", false);
    case("127.0.0.1", false);
    case("127.255.255.254", false);
    case("169.254.0.1", false);
    case("169.254.169.254", false);
    case("172.16.0.1", false);
    case("172.31.255.255", false);
    case("192.0.0.192", false);
    case("192.0.2.1", false);
    case("192.88.99.1", false);
    case("192.168.0.1", false);
    case("192.168.255.255", false);
    case("198.18.0.1", false);
    case("198.19.255.255", false);
    case("198.51.100.1", false);
    case("203.0.113.1", false);
    case("224.0.0.1", false);
    case("239.255.255.255", false);
    case("240.0.0.1", false);
    case("255.255.255.255", false);

    case("2606:4700:4700::1111", true);
    case("2001:4860:4860::8888", true);
    case("2001:200::1", true);
    case("2003::1", true);
    case("3ffe::1", true);

    case("::", false);
    case("::1", false);
    case("::127.0.0.1", false);
    case("::ffff:127.0.0.1", false);
    case("::ffff:8.8.8.8", false);
    case("::ffff:169.254.169.254", false);
    case("64:ff9b::7f00:1", false);
    case("64:ff9b::808:808", false);
    case("64:ff9b:1::1", false);
    case("100::1", false);
    case("2001::1", false);
    case("2001:db8::1", false);
    case("2002:7f00:1::1", false);
    case("3fff::1", false);
    case("fc00::1", false);
    case("fd00:ec2::254", false);
    case("fe80::1", false);
    case("febf::1", false);
    case("fec0::1", false);
    case("ff02::1", false);
    case("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", false);
  }
}
