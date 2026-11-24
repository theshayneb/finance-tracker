import { describe, it, expect } from 'vitest'
import { parseFollowUpsEmbed } from '../../src/view/followUps'

describe('parseFollowUpsEmbed', () => {
  it('uses the follow-up tag from settings when the block is empty', () => {
    expect(parseFollowUpsEmbed('', 'follow_up')).toBe('follow_up')
    expect(parseFollowUpsEmbed('\n  \n', 'follow_up')).toBe('follow_up')
  })

  it('uses the tag on the first line, with or without #', () => {
    expect(parseFollowUpsEmbed('reimburse', 'follow_up')).toBe('reimburse')
    expect(parseFollowUpsEmbed('\n #reimburse \nignored', 'follow_up')).toBe('reimburse')
  })

  it('gives an empty tag when neither is set', () => {
    expect(parseFollowUpsEmbed('', '')).toBe('')
  })
})
