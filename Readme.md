# Alice

一個使用`node.js`實作的discord bot

受jasonkao402的[項目]([github.com/jasonkao402/PyDiscordBot/tree/master](https://github.com/jasonkao402/PyDiscordBot/tree/master))啟發(~~實際上就是抄了不少)~~

Alice的`battle`功能源自`米米警察`的`aibattle`系列指令(最初用於測試API調用)

## 環境配置

此機器人需要安裝以下依賴模組:

- `discord.js 14.27.0`
- `lodash 4.18.1`
- `file-type 22.0.1`
- `moment 2.30.1`
- `openai 6.49.0`

## 運行前準備

請在`assets`下新增:

- `cats`資料夾
- `quotes`資料夾
- `private-battle_API_config.json`
- `private-chat_API_config.json`
- `bot_assets.json`
- `cats.json`
- `defined_function.json`
- `message_repository.json`
- `persona.json`
- `quotes.json`
- `user_repository.json`

相關配置如下:

### cats

空資料夾。

### quotes

空字料夾。

### API_config

如果要在`battle`與`chat`功能中使用不同的API配置請用`private-`開頭自行修改源碼的配置搜索，否則可以統一使用`API_config.json`作為檔案名稱。

#### 必要參數

- `url`: API要發送請求的網址
- `key`: API key
- `rpm`: 每分鐘可發送多少請求
- `concurrent_limit`: 同時可發送多少請求
- `allowed_image`: 該API是否允許發送圖片
- `round_robin_quota`: 該API允許連續請求幾次
- `avalible_model`: 可用模型列表
- `current_use`: 當前正在使用哪種模型
- `max_tokens`: 同open ai API的同名參數

#### 選填參數

- `temperature`: 同open ai API的同名參數
- `presence_penalty`: 同open ai API的同名參數
- `frequency_penalty`: 同open ai API的同名參數
- `top_p`: 同open ai API的同名參數
- `extra_body`: 同open ai API的同名參數

### bot_assets

- `token`: 機器人的token
- `clientId`: 機器人的client id
- `owner`: 傭有者的discord id
- `test_server_guildId`: 測試伺服器的伺服器id
- `opening_channel`: 用於在機器人上線時發送提醒訊息的頻道id
- `debug_channel`: 用於在程式報錯時直接發送錯誤訊息的頻道id
- `COT_channel`: 用於紀錄`chat`回傳的COT的頻道id
- `quote_command_available`: 空陣列
- `battle_command_available`: 空陣列
- `chatable_channel`: 空陣列

### cats.json

空陣列

### defined_function.json

空陣列

### message_repository.json

空陣列

### persona.json

空陣列
或者你可以根據`/persona_help`指令的說明加入`system`的persona(我懶得寫了)

### quotes.json

空陣列

### user_repository.json

空陣列

## 附錄

我寫這些幹嘛...

算了反正也沒人看。
