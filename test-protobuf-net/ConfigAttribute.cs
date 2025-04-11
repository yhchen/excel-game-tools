using System;

namespace ETModel
{
	public class ConfigAttribute: Attribute
	{
		public ConfigAttribute(int appType)
		{
			this.appType = appType;
		}

		private int appType;
	}
}