import { Address, isAddress, isGlobalAddress, TARGET_SEPARATOR } from './address'

test('address construction', () => {
  const path = 'src/helloworld'
  const targetName = 'mylib'
  const address = new Address(path, targetName)

  // Test the address getter
  expect(address.address).toEqual(`${path}${TARGET_SEPARATOR}${targetName}`)

  // Test the parse static method
  const parsedAddress = Address.parse(`${path}${TARGET_SEPARATOR}${targetName}`)
  expect(parsedAddress.path).toEqual(path)
  expect(parsedAddress.targetName).toEqual(targetName)
})

test("isAddress should check if the string is a valid address", () => {
  expect(isAddress("src/helloworld:mylib")).toBe(true)
  expect(isAddress("src/helloworld")).toBe(false)
})

test("isGlobalAddress should check if the string is a valid address and a valid global address", () => {
  expect(isGlobalAddress('//src/helloworld:mylib')).toBe(true)
  expect(isGlobalAddress('src/helloworld:mylib')).toBe(false)
  expect(isGlobalAddress('//src/helloworld')).toBe(false)
})