import { ScraperSettings, SettingsContext } from "@/context/settings";
import { useContext, useEffect, useState } from "react";
import InputText from "../ui/inputtext";
import _ from "lodash";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

const Settings = () => {
  const { settings, saveSettings } = useContext(SettingsContext);
  const [draft, setDraft] = useState<ScraperSettings>(settings);
  const [visible, setVisible] = useState(false);

  const handleSave = () => {
    saveSettings(draft);
  };

  return <div>
    <div
      className="mb-4 text-lg flex items-center cursor-pointer"
      onClick={() => setVisible(prev => !prev)}
    >
      <span className="flex-1"></span>
      <span>Settings</span>
      <span className="flex-1" >
        {visible ?
          <FaAngleUp className="ml-auto" /> :
          <FaAngleDown className="ml-auto" />
        }
      </span>
    </div>
    {visible === true && <>
      <div className="mb-4">
        <div className="mb-2">Fetch question links</div>
        <div className="flex flex-wrap gap-4">
          <InputText
            className="flex-1 min-w-60"
            label="Batch size"
            type="number"
            value={draft.questionLinks.batchSize.toString()}
            onChange={e => setDraft(prev => ({ ...prev, questionLinks: { ...prev.questions, batchSize: parseInt(e.target.value) } }))}
          />
          <InputText
            className="flex-1 min-w-60"
            label="Sleep duration between batches"
            type="number"
            value={draft.questionLinks.sleepDuration.toString()}
            onChange={e => setDraft(prev => ({ ...prev, questionLinks: { ...prev.questions, sleepDuration: parseInt(e.target.value) } }))}
          />
        </div>
      </div>
      <div>
        <div className="mb-2">Fetch questions</div>
        <div className="flex flex-wrap gap-4">
          <InputText
            className="flex-1 min-w-60"
            label="Batch size"
            type="number"
            value={draft.questions.batchSize.toString()}
            onChange={e => setDraft(prev => ({ ...prev, questions: { ...prev.questions, batchSize: parseInt(e.target.value) } }))}
          />
          <InputText
            className="flex-1 min-w-60"
            label="Sleep duration between batches"
            type="number"
            value={draft.questions.sleepDuration.toString()}
            onChange={e => setDraft(prev => ({ ...prev, questions: { ...prev.questions, sleepDuration: parseInt(e.target.value) } }))}
          />
        </div>
      </div>
      <button
        className="button-default mt-4 w-full"
        onClick={handleSave}
        disabled={_.isEqual(draft, settings)}
      >
        Save
      </button>
    </>}
  </div>;
};

export default Settings;