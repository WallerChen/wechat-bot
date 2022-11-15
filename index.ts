#!/usr/bin/env -S node --no-warnings --loader ts-node/esm
/**
 * Wechaty - Conversational RPA SDK for Chatbot Makers.
 *  - https://github.com/wechaty/wechaty
 */
// https://stackoverflow.com/a/42817956/1123955
// https://github.com/motdotla/dotenv/issues/89#issuecomment-587753552
import 'dotenv/config.js'
import {BosClient} from '@baiducloud/sdk';
import md5 from 'md5';
import fs from 'fs';

import {
  Contact,
  Message,
  ScanStatus,
  WechatyBuilder,
  log,
}                  from 'wechaty'

import { FileBox }  from 'file-box'
import CircelJson from 'circular-json';
import axios from 'axios';
import FormData from 'form-data';
import qrcodeTerminal from 'qrcode-terminal'
interface userType {
  name: string | any;
  serviceType: number,
  serviceQeury: string,
  taskId: number,
  originMsg: Message,
  response: boolean
}

const userMapQuery: userType[] = [];

const config = {
  endpoint: 'https://bj.bcebos.com',         //传入Bucket所在区域域名
  credentials: {
     ak: '158868ab8ffa4a85af643464d9d80ce3',         //您的AccessKey
     sk: '25907b22472f41f099fb8092dda5b849'       //您的SecretAccessKey
  }
};

let bucket = 'wenxin-bot';
let client = new BosClient(config);
// console.log(fsdirname);
 // 请求转成img
// axios.get('https://wenxin.baidu.com/younger/file/ERNIE-ViLG/e7c4f3008e05d2d80e76fa8f15fc6ec130').then((res) => {
//   let imgFile = new File([res.data], 'textext', { type: "image/jpeg" });
//   client.putObjectFromFile(bucket, 'text', imgFile)
//     .then(response => console.log(response))    // 成功
//     .catch(error => console.error(error));      // 失败
//   // callback(imgFile);
// });



const bot = WechatyBuilder.build({
  name: 'wechat-bot',
  /**
   * How to set Wechaty Puppet Provider:
   *
   *  1. Specify a `puppet` option when instantiating Wechaty. (like `{ puppet: 'wechaty-puppet-whatsapp' }`, see below)
   *  1. Set the `WECHATY_PUPPET` environment variable to the puppet NPM module name. (like `wechaty-puppet-whatsapp`)
   *
   * You can use the following providers locally:
   *  - wechaty-puppet-wechat (web protocol, no token required)
   *  - wechaty-puppet-whatsapp (web protocol, no token required)
   *  - wechaty-puppet-padlocal (pad protocol, token required)
   *  - etc. see: <https://wechaty.js.org/docs/puppet-providers/>
   */
  // puppet: 'wechaty-puppet-whatsapp'

  /**
   * You can use wechaty puppet provider 'wechaty-puppet-service'
   *   which can connect to remote Wechaty Puppet Services
   *   for using more powerful protocol.
   * Learn more about services (and TOKEN) from https://wechaty.js.org/docs/puppet-services/
   */
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    uos: true
  }
})


bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)
bot.on("friendship", onFriendship);

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch(e => log.error('StarterBot', e))


function onScan (qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('')
    log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)

    qrcodeTerminal.generate(qrcode, { small: true })  // show qrcode on console

  } else {
    log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
  }
}


function onLogin (user: Contact) {
  log.info('StarterBot', '%s login', user)
  // 群聊管理
  let manageRoomList = ['脱单1班','脱单2班','脱单3班','脱单4班'];
  // 对群聊添加监听群成员
  for (const roomName of manageRoomList) {
    manageRoom(roomName);
  }
  // 发布订阅 订阅最新话题内容 对群聊发送
  for (const roomName of manageRoomList) {
    getRoomTopic(roomName);
  }
 
  // setInterval(() => {
  //   userMapQuery.forEach(item => {
  //      setTimeout(() => {
  //       getWenXin(item.originMsg, item.name , item.taskId);
  //      }, 5000);
  //   })
  // },10000);
}

function onLogout (user: Contact) {
  log.info('StarterBot', '%s logout', user)
}

function onErrorMsg(msg: Message) {
  msg.say('不好意思，暂时不知道这个命令呢');
}

// function requestWenXin (msg:Message,style:string ,query:string) {
//   let name = msg.from()?.payload?.name;
//   console.log('name:' + name);
//   console.log('style:' + style);
//   console.log('query:' + query);
//   axios.post('https://wenxin.baidu.com/moduleApi/portal/api/rest/1.0/ernievilg/v1/txt2img?access_token=24.aed2df5d4efb748b51cd2070bae3b583.86400000.1667562700321.60b3726ee254ed854f777262c0474311-135697', 
//   {
//     style: style,
//     text: query
//   }, {
//   headers: {
//     'Content-Type': 'multipart/form-data'
//   }
// }).then(data => {
//     console.log('name:' + name);
//     console.log('serviceQeury:' + query);
//     let resData = CircelJson.parse(CircelJson.stringify(data.data));
//     console.log('taskId:' + resData.data.taskId);
//     userMapQuery.push({
//         name: name,
//         serviceType: 1,
//         serviceQeury: query,
//         taskId: resData.data.taskId,
//         originMsg: msg,
//         response: false
//       }
//     );
//     console.log('request:' +  CircelJson.stringify(data.data));
// }).catch(e => {
//     console.log('e:' + e);
//     onErrorMsg(msg);
// })
// }

// function getWenXin (msg: Message ,name:string | undefined ,taskId:number) {
//     const formData = new FormData();
//     formData.append('taskId', taskId);
//     var name = name ;
//     axios.post('https://wenxin.baidu.com/moduleApi/portal/api/rest/1.0/ernievilg/v1/getImg?access_token=24.aed2df5d4efb748b51cd2070bae3b583.86400000.1667562700321.60b3726ee254ed854f777262c0474311-135697',
//     formData).then(data => {
//       console.log('getwenxin:' + CircelJson.stringify(data.data));
//       // 获取模型结果图片
//       let result =  CircelJson.parse(CircelJson.stringify(data.data));
//       if(!result.data.img) { return;}
//       axios.get(result.data.img, {
//           responseType: 'arraybuffer'
//       }).then((res) => {
//           let dirName = name + '-' + taskId;
//           let md5Name = md5(dirName);
         
//           console.dir(res.data, { deep: true })
//           fs.writeFile(md5Name  + '.jpeg', res.data, { encoding: "binary" }, (e) => {
//               if(!e) {
//                 client.putObjectFromFile(bucket, md5Name  + '.jpeg', md5Name  + '.jpeg')
//                     .then(response => {
//                       const fileBox = FileBox.fromUrl('https://wenxin-bot.bj.bcebos.com/' + md5Name + '.jpeg');
//                       console.log(fileBox);
//                       msg.say(fileBox);
//                     })    // 成功
//                     .catch(error => console.error(error));      // 失败
//               }
//           } )
//       })
//       // // 获取结果后删除数组
//       for (const index in userMapQuery) {
//         if(userMapQuery[index].taskId === taskId){
//           userMapQuery.splice(index as number ,1);
//         }
//       }
//     }).catch(e => {
//       console.log('e:' + e);
//     })
//   }
async function onMessage (msg: Message) {
  log.info('StarterBot', msg.toString())
  console.log(msg);
  // 名字隔离
  let originMsg = msg.text().split(' ');
  let aitUser = originMsg[0];
  if(aitUser !== '@歪锅头') return;
  console.log('originMsg:'+ JSON.stringify(originMsg));
  console.log('originMsg:'+ originMsg.length);
  let style = originMsg[1].split(' ')[0];
  let query = originMsg[1].split(' ')[1];
  console.log(aitUser)
  console.log(style)
  console.log(query)
//   if (aitUser === '@歪锅头' && style && query) {
//     requestWenXin(msg, style, query);
//   };
  
}

// 群聊管理
async function manageRoom(roomName) {
  log.info("Bot", "manageRoom()");
  /**
   * Find Room
   */
  try {
    // 需要管理的微信群
    const room = await bot.Room.find({ topic: new RegExp(roomName)});
    if (!room) {
      log.warn("Bot", "Room no get");
      return;
    }
    log.info("Bot", 'start monitor "ding" room join/leave/topic event');

    /**
     * Event: Join
     */
    room.on("join", function (inviteeList, inviter) {
      log.verbose(
        "Bot",
        'Room EVENT: join - "%s", "%s"',
        inviteeList.map((c) => c.name()).join(", "),
        inviter.name()
      );
      // console.log('inviteeList: ' + JSON.stringify(inviteeList));
      // console.log('inviter: ' + JSON.stringify(inviter));
      // console.log('--------------------------------');
      // console.log("room.on(join) id:", this.id);
      checkRoomJoin.call(this, room, inviteeList, inviter);
    });

    // /**
    //  * Event: Leave
    //  */
    // room.on("leave", (leaverList, remover) => {
    //   log.info(
    //     "Bot",
    //     'Room EVENT: leave - "%s" leave(remover "%s"), byebye',
    //     leaverList.join(","),
    //     remover || "unknown"
    //   );
    // });

    /**
  //    * Event: Topic Change
  //    */
  //   room.on("topic", (topic, oldTopic, changer) => {
  //     log.info(
  //       "Bot",
  //       'Room EVENT: topic - changed from "%s" to "%s" by member "%s"',
  //       oldTopic,
  //       topic,
  //       changer.name()
  //     );
  //   });
  } catch (e) {
    log.warn("Bot", 'Room.find rejected: "%s"', e);
  }
}
// 群聊话题订阅
async function getRoomTopic(roomName) {

}

async function checkRoomJoin(room:any, inviteeList:any, inviter:any) {
  log.info(
    "Bot",
    'checkRoomJoin("%s", "%s", "%s")',
    await room.topic(),
    inviteeList.map((c:any) => c.name()).join(","),
    inviter.name()
  );

  try {
    // let to, content
    //  TODO: 群聊人数统计并沟通
    //  TODO: 群聊每日话题管理
    const userSelf = bot?.userSelf();
    // 如果邀请者不是自己
    // if (inviter.id !== userSelf.id) {
      // await room.say(
      //   "RULE1: Invitation is limited to me, the owner only. Please do not invite people without notifying me.",
      //   inviter
      // );
      // await room.say(
      //   'Please contact me: by send "ding" to me, I will re-send you an invitation. Now I will remove you out, sorry.',
      //   inviteeList
      // );
      // await room.topic("ding - warn " + inviter.name());
      // setTimeout((_) => inviteeList.forEach((c:any) => room.del(c)), 10 * 1000);
    // } 
    // else {

      // TODO 进群需要发的文案
      await room.say(`欢迎${inviteeList.map((c:any) => c.name()).join(",")}宝贝进群🥰~ 
      记得改名哟，蹲个自我介绍！ （p.s. 咋改名+我们写的走心群介绍可以看公告小作文）
      `);
      // let welcomeTopic;
      // welcomeTopic = inviteeList.map((c:any) => c.name()).join(", ");
      // await room.topic("ding - welcome " + welcomeTopic);
    // }
  } catch (e) {
    log.error("Bot", "checkRoomJoin() exception: %s", e);
  }
}

// 联系人添加好友
async function onFriendship(friendship) {
  let logMsg;
  const fileHelper = bot.Contact.load("filehelper");

  try {
    logMsg = "received `friend` event from " + friendship.contact().name();
    await fileHelper.say(logMsg);
    console.log(logMsg);
    switch (friendship.type()) {
      // received
      case 2:
        if (friendship.hello() === "ding") {
          logMsg = 'accepted automatically because verify message is "ding"';
          console.log("before accept");
          await friendship.accept();
    
          await new Promise((r) => setTimeout(r, 1000));
          await friendship.contact().say("hello from Wechaty");
          console.log("after accept");
        } else {
          logMsg =
            "not auto accepted, because verify message is: " + friendship.hello();
        }
        break;
      //  confrim
      case 1:
        logMsg = "friendship confirmed with " + friendship.contact().name();
        break;
    
      default:
        break;
    }
  } catch (e) {
    logMsg = e.message;
  }
  console.log(logMsg);
  await fileHelper.say(logMsg);
}