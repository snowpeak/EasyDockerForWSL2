import {Config} from "./Config";

export class i18nUtil{
    constructor(){}
    public static getI18nJson(){
        let p_config = Config.getInstance();

        const p_msg = {
            ja: require('../../resource/message_ja.json'),
            en: require('../../resource/message_en.json')
        }
        let p_i18n = {
            locale: p_config.getString("lang", "ja"),
            fallbackLocale: 'ja',
            messages: p_msg
        }
        return p_i18n;
    }
}